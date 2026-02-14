import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'

const FAQ_ITEMS = [
  {
    question: 'Como compro um ingresso?',
    answer:
      'Escolha o evento, selecione o tipo de ingresso e finalize a compra. O ingresso fica disponível na sua área de “Meus ingressos”.',
  },
  {
    question: 'Posso transferir meu ingresso para outra pessoa?',
    answer:
      'Sim. Alguns eventos permitem transferência. Você encontra essa opção no detalhe do ingresso, quando disponível.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer:
      'Cartão de crédito e PIX. Em alguns eventos, pode haver opções adicionais configuradas pelo organizador.',
  },
  {
    question: 'Como recebo meu ingresso?',
    answer:
      'Após a confirmação do pagamento, o ingresso é liberado automaticamente na sua conta.',
  },
  {
    question: 'Sou organizador. Como publico meu evento?',
    answer:
      'Crie sua conta, cadastre o evento com data, local e ingressos, e publique. Nossa equipe revisa informações básicas para garantir qualidade.',
  },
]

function FaqSection() {
  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Perguntas frequentes
        </Typography>
        <Typography color="text.secondary">
          Respostas rápidas para você comprar com segurança.
        </Typography>
      </Stack>
      <Stack spacing={1.5}>
        {FAQ_ITEMS.map((item) => (
          <Accordion key={item.question} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreRounded />}>
              <Typography fontWeight={600}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  )
}

export default FaqSection
